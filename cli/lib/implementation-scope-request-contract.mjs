import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const FILE_FIELDS = ["inspect", "change", "generated"];
const DEPENDENCY_ACTIONS = new Set(["add", "remove", "upgrade"]);
const OWNERS = new Set(["user", "unknown"]);
const CHANGE_HANDLING = new Set(["preserve", "allow-overlap", "block"]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value;
}

function exactKeys(value, keys, field) {
  const actual = Object.keys(object(value, field)).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${field} keys must be exactly: ${keys.join(", ")}`);
  }
}

function text(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function boolean(value, field) {
  if (typeof value !== "boolean") throw new Error(`${field} must be a boolean`);
}

function textList(value, field, { allowEmpty = true } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${field} must be ${allowEmpty ? "an" : "a non-empty"} array`);
  }
  value.forEach((item, index) => text(item, `${field}[${index}]`));
  if (new Set(value).size !== value.length) throw new Error(`${field} must not contain duplicates`);
}

function safeSelector(value, field) {
  text(value, field);
  if (path.isAbsolute(value) || value.split(/[\\/]/).includes("..") || /[\0\r\n]/.test(value)) {
    throw new Error(`${field} must be a relative selector without traversal`);
  }
}

function command(value, field) {
  text(value, field);
  if (/[\0\r\n]/.test(value)) throw new Error(`${field} must be one command line`);
}

function validateFiles(files) {
  exactKeys(files, ["inspect", "change", "generated"], "implementation scope request files");
  for (const field of FILE_FIELDS) {
    textList(files[field], `implementation scope request files.${field}`, {
      allowEmpty: field !== "change",
    });
    files[field].forEach((selector, index) => {
      safeSelector(selector, `implementation scope request files.${field}[${index}]`);
    });
  }
  const inspected = new Set(files.inspect);
  for (const selector of files.change) {
    if (!inspected.has(selector)) {
      throw new Error("every changed-file selector must also appear in files.inspect");
    }
  }
}

function validateDependencies(dependencies) {
  if (!Array.isArray(dependencies)) {
    throw new Error("implementation scope request dependencies must be an array");
  }
  dependencies.forEach((dependency, index) => {
    const field = `implementation scope request dependencies[${index}]`;
    exactKeys(dependency, ["name", "action", "reason"], field);
    text(dependency.name, `${field}.name`);
    if (!DEPENDENCY_ACTIONS.has(dependency.action)) {
      throw new Error(`${field}.action must be add, remove, or upgrade`);
    }
    text(dependency.reason, `${field}.reason`);
  });
  const keys = dependencies.map(({ name, action }) => `${action}:${name}`);
  if (new Set(keys).size !== keys.length) {
    throw new Error("implementation scope request dependencies must not contain duplicates");
  }
}

function validateMigrations(migrations) {
  if (!Array.isArray(migrations)) {
    throw new Error("implementation scope request migrations must be an array");
  }
  migrations.forEach((migration, index) => {
    const field = `implementation scope request migrations[${index}]`;
    exactKeys(migration, ["name", "command", "affectsExternalState"], field);
    text(migration.name, `${field}.name`);
    command(migration.command, `${field}.command`);
    boolean(migration.affectsExternalState, `${field}.affectsExternalState`);
  });
}

function validateExternalWrites(writes) {
  if (!Array.isArray(writes)) {
    throw new Error("implementation scope request externalWrites must be an array");
  }
  writes.forEach((write, index) => {
    const field = `implementation scope request externalWrites[${index}]`;
    exactKeys(write, ["system", "action", "destination"], field);
    text(write.system, `${field}.system`);
    text(write.action, `${field}.action`);
    text(write.destination, `${field}.destination`);
  });
}

function validatePreExistingChanges(changes) {
  if (!Array.isArray(changes)) {
    throw new Error("implementation scope request preExistingChanges must be an array");
  }
  changes.forEach((change, index) => {
    const field = `implementation scope request preExistingChanges[${index}]`;
    exactKeys(change, ["statusEntry", "owner", "handling"], field);
    text(change.statusEntry, `${field}.statusEntry`);
    if (!OWNERS.has(change.owner)) throw new Error(`${field}.owner must be user or unknown`);
    if (!CHANGE_HANDLING.has(change.handling)) {
      throw new Error(`${field}.handling must be preserve, allow-overlap, or block`);
    }
  });
  const entries = changes.map((change) => change.statusEntry);
  if (new Set(entries).size !== entries.length) {
    throw new Error("implementation scope request preExistingChanges must not contain duplicates");
  }
}

export function validateImplementationScopeRequest(request) {
  exactKeys(request, [
    "kind",
    "schemaVersion",
    "objective",
    "intendedBehavior",
    "files",
    "dependencies",
    "migrations",
    "externalWrites",
    "verificationCommands",
    "risks",
    "preExistingChanges",
    "release",
  ], "implementation scope request");
  if (request.kind !== "design-ai-implementation-scope-request" || request.schemaVersion !== 1) {
    throw new Error("implementation scope request must be design-ai-implementation-scope-request v1");
  }
  text(request.objective, "implementation scope request objective");
  textList(request.intendedBehavior, "implementation scope request intendedBehavior", { allowEmpty: false });
  validateFiles(request.files);
  validateDependencies(request.dependencies);
  validateMigrations(request.migrations);
  validateExternalWrites(request.externalWrites);
  textList(request.verificationCommands, "implementation scope request verificationCommands", { allowEmpty: false });
  request.verificationCommands.forEach((item, index) => {
    command(item, `implementation scope request verificationCommands[${index}]`);
  });
  textList(request.risks, "implementation scope request risks", { allowEmpty: false });
  validatePreExistingChanges(request.preExistingChanges);
  exactKeys(request.release, ["commit", "push", "deployment"], "implementation scope request release");
  boolean(request.release.commit, "implementation scope request release.commit");
  boolean(request.release.push, "implementation scope request release.push");
  boolean(request.release.deployment, "implementation scope request release.deployment");
  return request;
}
