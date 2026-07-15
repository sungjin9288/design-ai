const REGEX_SPECIAL = /[\\^$+?.()|{}[\]]/;

function escape(character) {
  return REGEX_SPECIAL.test(character) ? `\\${character}` : character;
}

function selectorPattern(selector) {
  let pattern = "^";
  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (character === "*" && selector[index + 1] === "*") {
      const followedBySlash = selector[index + 2] === "/";
      pattern += followedBySlash ? "(?:.*/)?" : ".*";
      index += followedBySlash ? 2 : 1;
    } else if (character === "*") {
      pattern += "[^/]*";
    } else if (character === "?") {
      pattern += "[^/]";
    } else {
      pattern += escape(character);
    }
  }
  return new RegExp(`${pattern}$`);
}

export function matchesFileSelector(filePath, selector) {
  return selectorPattern(selector).test(filePath);
}

export function matchingFileSelector(filePath, selectors) {
  return selectors.find((selector) => matchesFileSelector(filePath, selector)) || "";
}
