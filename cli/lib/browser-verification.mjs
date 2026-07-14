import { unknownOptionMessage } from "./suggest.mjs";

const OPTIONS = [
  "-h", "--help", "--url", "--target-root", "--approval-ref", "--adapter", "--adapter-arg", "--viewport", "--yes", "--json",
];

function requiredValue(args, index, option, { allowOption = false } = {}) {
  const value = args[index + 1];
  if (!value || (!allowOption && value.startsWith("--"))) throw new Error(`${option} requires a value`);
  return value;
}

export function parseBrowserViewport(value) {
  const match = String(value || "").match(/^([a-z0-9][a-z0-9-]*)=(\d{2,5})x(\d{2,5})$/i);
  if (!match) throw new Error("--viewport must use name=WIDTHxHEIGHT, for example mobile=390x844");
  const viewport = { name: match[1], width: Number(match[2]), height: Number(match[3]) };
  if (viewport.width < 240 || viewport.height < 240) {
    throw new Error("browser verification viewports must be at least 240x240");
  }
  return viewport;
}

export function parseBrowserVerificationArgs(args) {
  const parsed = {
    reportPath: "", url: "", targetRoot: "", approvalRef: "", adapter: "", adapterArgs: [],
    viewports: [], approved: false, json: false, help: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--yes") parsed.approved = true;
    else if (arg === "--json") parsed.json = true;
    else if (["--url", "--target-root", "--approval-ref"].includes(arg)) {
      const value = requiredValue(args, index, arg);
      if (arg === "--url") parsed.url = value;
      if (arg === "--target-root") parsed.targetRoot = value;
      if (arg === "--approval-ref") parsed.approvalRef = value;
      index += 1;
    }
    else if (arg === "--adapter") {
      parsed.adapter = requiredValue(args, index, arg);
      index += 1;
    } else if (arg === "--adapter-arg") {
      parsed.adapterArgs.push(requiredValue(args, index, arg, { allowOption: true }));
      index += 1;
    } else if (arg === "--viewport") {
      parsed.viewports.push(parseBrowserViewport(requiredValue(args, index, arg)));
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("verify-browser", arg, OPTIONS));
    } else if (!parsed.reportPath) parsed.reportPath = arg;
    else throw new Error(`verify-browser accepts one quality report; received unexpected argument: ${arg}`);
  }
  const names = parsed.viewports.map((viewport) => viewport.name);
  if (new Set(names).size !== names.length) throw new Error("--viewport names must not repeat");
  return parsed;
}
