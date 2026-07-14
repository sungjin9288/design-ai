function normalizedText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function labelText(element, labelsByTarget, elementsById) {
  const referencedText = normalizedText(element.attributes["aria-labelledby"])
    .split(/\s+/)
    .map((id) => elementsById.get(id)?.referenceText)
    .filter(Boolean);
  return normalizedText([
    element.attributes["aria-label"],
    element.attributes.placeholder,
    element.labelAncestor?.accessibleText,
    element.attributes.id ? labelsByTarget.get(element.attributes.id) : "",
    ...referencedText,
  ].filter(Boolean).join(" "));
}

function reference(sourceRef, element) {
  return `${sourceRef}:${element.line}`;
}

function packFindingId(pack, criterion) {
  return `product-pack:${pack.id}:${criterion.id}`;
}

function unverifiedFinding(pack, criterion) {
  const mode = criterion.mode === "browser-required" ? "browser" : "scenario";
  return {
    id: packFindingId(pack, criterion),
    lens: criterion.lens,
    severity: criterion.severity,
    status: "unverified",
    title: criterion.title,
    location: `product-pack:${pack.id}#${criterion.id}`,
    before: `The supplied HTML does not prove this ${mode} criterion.`,
    after: criterion.question,
    why: criterion.evidence,
    evidence: [{
      kind: "manual",
      reference: `product-packs/${pack.id}.json#revision-${pack.revision}:${criterion.id}`,
      observation: `Review pack revision ${pack.revision} requires ${criterion.mode} evidence and the static inspector did not collect it.`,
    }],
    verification: [...criterion.verification],
  };
}

function confirmedFinding(pack, criterion, sourceRef, matches, before, after, observation) {
  const first = matches[0];
  const location = reference(sourceRef, first);
  return {
    id: packFindingId(pack, criterion),
    lens: criterion.lens,
    severity: criterion.severity,
    status: "confirmed",
    title: criterion.title,
    location,
    before,
    after,
    why: criterion.question,
    evidence: [{ kind: "code", reference: location, observation }],
    verification: [...criterion.verification],
  };
}

function phoneInputFinding(pack, criterion, context) {
  const phoneSignal = /(?:^|[^a-z])(phone|mobile|tel)(?:[^a-z]|$)|휴대폰|전화/i;
  const candidates = context.elements.filter((element) => {
    if (element.inactive || element.name !== "input") return false;
    const attributes = element.attributes;
    const signal = [
      attributes.type,
      attributes.name,
      attributes.id,
      attributes.autocomplete,
      labelText(element, context.labelsByTarget, context.elementsById),
    ].join(" ");
    return phoneSignal.test(signal);
  });
  const matches = candidates.filter((element) => (
    normalizedText(element.attributes.type).toLowerCase() !== "tel"
    || normalizedText(element.attributes.autocomplete).toLowerCase() !== "tel"
  ));
  if (matches.length === 0) return null;
  return confirmedFinding(
    pack,
    criterion,
    context.sourceRef,
    matches,
    `${matches.length} phone-like input(s) omit type=tel, autocomplete=tel, or both.`,
    "Use type=tel and autocomplete=tel on fields that collect the user's phone number.",
    "Deterministic static inspection found a phone-like input without both native phone semantics.",
  );
}

function passwordAutocompleteFinding(pack, criterion, context) {
  const allowed = new Set(["current-password", "new-password"]);
  const transactionSignal = /(?:transaction|payment|pin|passcode|otp)|거래|결제|카드\s*비밀번호|간편\s*비밀번호|인증번호|핀\s*번호/i;
  const matches = context.elements.filter((element) => (
    !element.inactive
    && element.name === "input"
    && normalizedText(element.attributes.type).toLowerCase() === "password"
    && !allowed.has(normalizedText(element.attributes.autocomplete).toLowerCase())
    && normalizedText(element.attributes.autocomplete).toLowerCase() !== "one-time-code"
    && !transactionSignal.test([
      element.attributes.name,
      element.attributes.id,
      labelText(element, context.labelsByTarget, context.elementsById),
    ].join(" "))
  ));
  if (matches.length === 0) return null;
  return confirmedFinding(
    pack,
    criterion,
    context.sourceRef,
    matches,
    `${matches.length} password input(s) do not declare current-password or new-password autocomplete intent.`,
    "Set autocomplete=current-password for sign-in or new-password for password creation.",
    "Deterministic static inspection found a password input without a supported password-manager token.",
  );
}

function marketingConsentFinding(pack, criterion, context) {
  const marketingSignal = /마케팅|광고|프로모션|혜택\s*알림|marketing|promotional?/i;
  const savedStateSignal = /saved|existing|history|receipt|preference|저장|기존|이력|영수증/i;
  const matches = context.elements.filter((element) => (
    !element.inactive
    && element.name === "input"
    && normalizedText(element.attributes.type).toLowerCase() === "checkbox"
    && Object.hasOwn(element.attributes, "checked")
    && !Object.hasOwn(element.attributes, "disabled")
    && normalizedText(element.attributes["aria-disabled"]).toLowerCase() !== "true"
    && normalizedText(element.attributes["aria-readonly"]).toLowerCase() !== "true"
    && !savedStateSignal.test([
      element.attributes["data-state"],
      element.attributes["data-consent-state"],
    ].join(" "))
    && marketingSignal.test(labelText(element, context.labelsByTarget, context.elementsById))
  ));
  if (matches.length === 0) return null;
  return confirmedFinding(
    pack,
    criterion,
    context.sourceRef,
    matches,
    `${matches.length} marketing consent checkbox(es) are checked in the supplied source.`,
    "Keep optional marketing consent separate and unchecked for a fresh user.",
    "Deterministic static inspection found a prechecked checkbox with marketing or promotional label text.",
  );
}

const STATIC_RULES = {
  "korean-phone-input-semantics": phoneInputFinding,
  "korean-auth-autocomplete": passwordAutocompleteFinding,
  "korean-marketing-consent-default": marketingConsentFinding,
};

export function inspectProductReviewPack(pack, context) {
  const findings = [];
  for (const criterion of pack.criteria) {
    if (criterion.mode !== "static-html") {
      findings.push(unverifiedFinding(pack, criterion));
      continue;
    }
    const finding = STATIC_RULES[criterion.id](pack, criterion, context);
    if (finding) findings.push(finding);
  }
  return findings;
}
